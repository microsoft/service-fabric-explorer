import { of, Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { RestClientService } from 'src/app/services/rest-client.service';
import { DataModelBase } from '../Base';
import { SimpleCollection, SimpleCollectionWithParent } from './CollectionBase';

// Mock raw data type
interface IRawTestItem {
    Id: string;
    Name: string;
}

// Mock model class
class TestModel extends DataModelBase<IRawTestItem> {
    constructor(data: DataService, raw: IRawTestItem) {
        super(data, raw);
    }

    public get uniqueId(): string {
        return this.raw.Id;
    }
}

// Mock model class with parent
class TestModelWithParent extends DataModelBase<IRawTestItem> {
    constructor(data: DataService, raw: IRawTestItem, public parent: { id: string }) {
        super(data, raw, parent);
    }

    public get uniqueId(): string {
        return this.raw.Id;
    }
}

// Mock parent type
interface ITestParent {
    id: string;
    name: string;
}

describe('CollectionBase', () => {
    const restClientMock: RestClientService = {} as RestClientService;

    const mockDataService: DataService = {
        restClient: restClientMock,
    } as DataService;

    describe('SimpleCollection', () => {
        let collection: SimpleCollection<TestModel, IRawTestItem>;
        let mockFetchFn: (data: DataService) => Observable<IRawTestItem[]>;
        const mockRawItems: IRawTestItem[] = [
            { Id: '1', Name: 'Item 1' },
            { Id: '2', Name: 'Item 2' },
            { Id: '3', Name: 'Item 3' }
        ];

        beforeEach(() => {
            mockFetchFn = jasmine.createSpy('fetchFn').and.returnValue(of(mockRawItems));
            collection = new SimpleCollection<TestModel, IRawTestItem>(
                mockDataService,
                TestModel,
                mockFetchFn
            );
        });

        it('should create a collection instance', () => {
            expect(collection).toBeTruthy();
            expect(collection.length).toBe(0);
            expect(collection.isInitialized).toBe(false);
        });

        it('should fetch and map items on refresh', async () => {
            await collection.refresh().toPromise();

            expect(mockFetchFn).toHaveBeenCalled();
            expect(collection.length).toBe(3);
            expect(collection.isInitialized).toBe(true);
        });

        it('should create correct model instances', async () => {
            await collection.refresh().toPromise();

            expect(collection.collection[0]).toBeInstanceOf(TestModel);
            expect(collection.collection[0].raw.Id).toBe('1');
            expect(collection.collection[0].raw.Name).toBe('Item 1');
        });

        it('should find items by uniqueId', async () => {
            await collection.refresh().toPromise();

            const found = collection.find('2');
            expect(found).toBeTruthy();
            expect(found.raw.Name).toBe('Item 2');
        });

        it('should return null for non-existing uniqueId', async () => {
            await collection.refresh().toPromise();

            const found = collection.find('999');
            expect(found).toBeFalsy();
        });
    });

    describe('SimpleCollectionWithParent', () => {
        let collection: SimpleCollectionWithParent<TestModelWithParent, IRawTestItem, ITestParent>;
        let mockFetchFn: (data: DataService, parent: ITestParent) => Observable<IRawTestItem[]>;
        const mockParent: ITestParent = { id: 'parent-1', name: 'Parent' };
        const mockRawItems: IRawTestItem[] = [
            { Id: 'p1-1', Name: 'Item 1' },
            { Id: 'p1-2', Name: 'Item 2' }
        ];

        beforeEach(() => {
            mockFetchFn = jasmine.createSpy('fetchFn').and.returnValue(of(mockRawItems));
            collection = new SimpleCollectionWithParent<TestModelWithParent, IRawTestItem, ITestParent>(
                mockDataService,
                mockParent,
                TestModelWithParent,
                mockFetchFn
            );
        });

        it('should create a collection instance with parent', () => {
            expect(collection).toBeTruthy();
            expect(collection.parent).toBe(mockParent);
            expect(collection.length).toBe(0);
            expect(collection.isInitialized).toBe(false);
        });

        it('should fetch items using parent in fetch function', async () => {
            await collection.refresh().toPromise();

            expect(mockFetchFn).toHaveBeenCalled();
            expect(collection.length).toBe(2);
        });

        it('should create model instances with parent reference', async () => {
            await collection.refresh().toPromise();

            expect(collection.collection[0]).toBeInstanceOf(TestModelWithParent);
            expect(collection.collection[0].parent).toBe(mockParent);
        });

        it('should handle empty collections', async () => {
            mockFetchFn = jasmine.createSpy('fetchFn').and.returnValue(of([]));
            collection = new SimpleCollectionWithParent<TestModelWithParent, IRawTestItem, ITestParent>(
                mockDataService,
                mockParent,
                TestModelWithParent,
                mockFetchFn
            );

            await collection.refresh().toPromise();

            expect(collection.length).toBe(0);
            expect(collection.isInitialized).toBe(true);
        });
    });
});
